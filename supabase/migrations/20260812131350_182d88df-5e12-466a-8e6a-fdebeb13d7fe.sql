
CREATE OR REPLACE FUNCTION public.is_business_member(_business_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = _business_id AND b.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.team_members m WHERE m.business_id = _business_id AND m.user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_business_editor(_business_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = _business_id AND b.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.team_members m WHERE m.business_id = _business_id AND m.user_id = auth.uid() AND m.role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.business_role(_business_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = _business_id AND b.user_id = auth.uid()) THEN 'owner'
    ELSE (SELECT m.role FROM public.team_members m WHERE m.business_id = _business_id AND m.user_id = auth.uid() LIMIT 1)
  END;
$$;

-- businesses
CREATE POLICY "Members select businesses" ON public.businesses
FOR SELECT TO authenticated USING (public.is_business_member(id));

-- read access for members on business-scoped tables
CREATE POLICY "Members select brands" ON public.brands
FOR SELECT TO authenticated USING (public.is_business_member(business_id));
CREATE POLICY "Members select product info" ON public.product_information
FOR SELECT TO authenticated USING (public.is_business_member(business_id));
CREATE POLICY "Members select identity" ON public.identity_verification
FOR SELECT TO authenticated USING (public.is_business_member(business_id));
CREATE POLICY "Members select business verif" ON public.business_verification
FOR SELECT TO authenticated USING (public.is_business_member(business_id));
CREATE POLICY "Members select bank verif" ON public.bank_verification
FOR SELECT TO authenticated USING (public.is_business_member(business_id));
CREATE POLICY "Members select api keys" ON public.api_keys
FOR SELECT TO authenticated USING (public.is_business_member(business_id));
CREATE POLICY "Members select payouts" ON public.payouts
FOR SELECT TO authenticated USING (public.is_business_member(business_id));
CREATE POLICY "Members select transactions" ON public.transactions
FOR SELECT TO authenticated USING (public.is_business_member(business_id));
CREATE POLICY "Members select platform settings" ON public.platform_settings
FOR SELECT TO authenticated USING (public.is_business_member(business_id));
CREATE POLICY "Members select sms wallets" ON public.sms_wallets
FOR SELECT TO authenticated USING (public.is_business_member(business_id));
CREATE POLICY "Members select sms ledger" ON public.sms_wallet_ledger
FOR SELECT TO authenticated USING (public.is_business_member(business_id));
CREATE POLICY "Members select sms campaigns" ON public.sms_campaigns
FOR SELECT TO authenticated USING (public.is_business_member(business_id));
CREATE POLICY "Members select sms messages" ON public.sms_messages
FOR SELECT TO authenticated USING (public.is_business_member(business_id));
CREATE POLICY "Members select sms contacts" ON public.sms_contacts
FOR SELECT TO authenticated USING (public.is_business_member(business_id));
CREATE POLICY "Members select sms groups" ON public.sms_contact_groups
FOR SELECT TO authenticated USING (public.is_business_member(business_id));
CREATE POLICY "Members select sms settings" ON public.sms_settings
FOR SELECT TO authenticated USING (public.is_business_member(business_id));
CREATE POLICY "Members select sender ids" ON public.sms_sender_ids
FOR SELECT TO authenticated USING (public.is_business_member(business_id));
CREATE POLICY "Members select otp requests" ON public.sms_otp_requests
FOR SELECT TO authenticated USING (public.is_business_member(business_id));
CREATE POLICY "Members select otp settings" ON public.sms_otp_settings
FOR SELECT TO authenticated USING (public.is_business_member(business_id));
CREATE POLICY "Members select ussd codes" ON public.ussd_codes
FOR SELECT TO authenticated USING (public.is_business_member(business_id));
CREATE POLICY "Members select ussd nodes" ON public.ussd_menu_nodes
FOR SELECT TO authenticated USING (public.is_business_member(business_id));
CREATE POLICY "Members select ussd sessions" ON public.ussd_sessions
FOR SELECT TO authenticated USING (public.is_business_member(business_id));
CREATE POLICY "Members select voice calls" ON public.voice_calls
FOR SELECT TO authenticated USING (public.is_business_member(business_id));
CREATE POLICY "Members select voice campaigns" ON public.voice_campaigns
FOR SELECT TO authenticated USING (public.is_business_member(business_id));
CREATE POLICY "Members select group members" ON public.sms_group_members
FOR SELECT TO authenticated USING (EXISTS (
  SELECT 1 FROM public.sms_contact_groups g
  WHERE g.id = sms_group_members.group_id AND public.is_business_member(g.business_id)
));

-- team members can see who else is in the workspace
CREATE POLICY "Members read team" ON public.team_members
FOR SELECT TO authenticated USING (public.is_business_member(business_id));

-- editor write access
CREATE POLICY "Editors write brands" ON public.brands
FOR ALL TO authenticated USING (public.is_business_editor(business_id)) WITH CHECK (public.is_business_editor(business_id));
CREATE POLICY "Editors write product info" ON public.product_information
FOR ALL TO authenticated USING (public.is_business_editor(business_id)) WITH CHECK (public.is_business_editor(business_id));
CREATE POLICY "Editors write identity" ON public.identity_verification
FOR ALL TO authenticated USING (public.is_business_editor(business_id)) WITH CHECK (public.is_business_editor(business_id));
CREATE POLICY "Editors write business verif" ON public.business_verification
FOR ALL TO authenticated USING (public.is_business_editor(business_id)) WITH CHECK (public.is_business_editor(business_id));
CREATE POLICY "Editors write bank verif" ON public.bank_verification
FOR ALL TO authenticated USING (public.is_business_editor(business_id)) WITH CHECK (public.is_business_editor(business_id));
CREATE POLICY "Editors write api keys" ON public.api_keys
FOR ALL TO authenticated USING (public.is_business_editor(business_id)) WITH CHECK (public.is_business_editor(business_id));
CREATE POLICY "Editors write sms campaigns" ON public.sms_campaigns
FOR ALL TO authenticated USING (public.is_business_editor(business_id)) WITH CHECK (public.is_business_editor(business_id));
CREATE POLICY "Editors write sms contacts" ON public.sms_contacts
FOR ALL TO authenticated USING (public.is_business_editor(business_id)) WITH CHECK (public.is_business_editor(business_id));
CREATE POLICY "Editors write sms groups" ON public.sms_contact_groups
FOR ALL TO authenticated USING (public.is_business_editor(business_id)) WITH CHECK (public.is_business_editor(business_id));
CREATE POLICY "Editors write sms settings" ON public.sms_settings
FOR ALL TO authenticated USING (public.is_business_editor(business_id)) WITH CHECK (public.is_business_editor(business_id));
CREATE POLICY "Editors write sender ids" ON public.sms_sender_ids
FOR ALL TO authenticated USING (public.is_business_editor(business_id)) WITH CHECK (public.is_business_editor(business_id));
CREATE POLICY "Editors write otp settings" ON public.sms_otp_settings
FOR ALL TO authenticated USING (public.is_business_editor(business_id)) WITH CHECK (public.is_business_editor(business_id));
CREATE POLICY "Editors write ussd codes" ON public.ussd_codes
FOR ALL TO authenticated USING (public.is_business_editor(business_id)) WITH CHECK (public.is_business_editor(business_id));
CREATE POLICY "Editors write ussd nodes" ON public.ussd_menu_nodes
FOR ALL TO authenticated USING (public.is_business_editor(business_id)) WITH CHECK (public.is_business_editor(business_id));
